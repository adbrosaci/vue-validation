import vue3 from '@adbros/eslint-config/vue3.js';

export default [
	...vue3,
	{
		ignores: [ 'dist' ],
	},
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
