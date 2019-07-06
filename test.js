import test from 'ava';
import alfyTest from 'alfy-test';

test(async t => {
	const alfy = alfyTest();
	const result = await alfy('local');

	t.deepEqual(result, [
		{
			title: 'Local By Flywheel',
			subtitle: 'Local by Flywheel actions'
		}
	]);
});
