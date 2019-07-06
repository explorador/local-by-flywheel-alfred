'use strict';
// Get Local By Flywheel Json directory.
const jsonDir = `${require('os').homedir()}/Library/Application Support/Local by Flywheel`;
const fs = require('fs');
const alfy = require('alfy');

/**
 * Alfred environment variables
 * @reference https://www.alfredapp.com/help/workflows/script-environment-variables/
 */
const {alfred_preferences, alfred_workflow_uid} = process.env; // eslint-disable-line camelcase

/**
 * Get Sites JSON data (Promise)
 * @param {file} File dir.
 */
function getSitesData(file) {
	return new Promise((resolve, reject) => {
		fs.readFile(file, 'utf8', function (err, data) {
			if (data) {
				resolve(JSON.parse(data));
			} else {
				reject(Error(err));
			}
		});
	});
}

/**
 * Add "Site Status" info (Promise)
 * @param {SiteData} Site original data.
 */
function addSiteStatus(siteData) {
	return new Promise((resolve, reject) => {
		fs.readFile(`${jsonDir}/site-statuses.json`, 'utf8', function (err, data) {
			if (data) {
				data = JSON.parse(data);
				let newSiteData = siteData; // Store in memory
				// Adding "status" object key/value to newSiteData
				Object.keys(newSiteData).map(key => newSiteData[key].status = data[key]); // eslint-disable-line no-return-assign
				resolve(newSiteData);
			} else {
				reject(Error(err));
			}
		});
	});
}

/**
 * Filter Site Data
 * @param {cb} cb
 */
function filterSiteData(cb) {
	// Get data from sites.json (promise)
	getSitesData(`${jsonDir}/sites.json`)
		.then(data => {
			// Get promise.
			return addSiteStatus(data);
		})
		.then(data => {
			// Convert object to array of objects
			let dataArray = Object.keys(data).map(site => data[site]);
			// Filter sites by text input (First character only, alfy does the rest in "inputMatches")
			cb(dataArray.filter(site => site.name[0].toLowerCase() === alfy.input[0].toLowerCase()));
		});
}

/**
 * Map data
 */
filterSiteData(async data => {
	const items = alfy
	.inputMatches(data, 'name')
	.map(site => ({
		title: site.name,
		subtitle: `https://${site.domain}`,
		arg: `https://${site.domain}`,
		mods: {
			cmd: {
				subtitle: 'Open Root Directory (app/public/)',
				arg: `file://${site.path}/app/public`,
			},
			alt: {
				subtitle: site.status === 'running' ? 'Open SSH' : 'Open SSH (Disabled when site is off)',
				arg: site.status === 'running' ? 'ssh' : 'false',
				variables: {
					container: site.container,
					sitename: site.name,
				},
			},
		},
		icon: {
			path: `${alfred_preferences}/workflows/${alfred_workflow_uid}/${site.status === 'running' ? 'icon.png' : 'icon-gray.png'}`, // eslint-disable-line camelcase
		},
	}));

	alfy.output(items);
});
