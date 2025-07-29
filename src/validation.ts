import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue';
import { omit } from 'radash';
import { safeParseAsync, flatten, type BaseIssue, type BaseSchema, type FlatErrors, type InferOutput, type BaseSchemaAsync, type InferInput } from 'valibot';
type CustomSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>> | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>;

const getFirstOfArray = <T>(value: T | T[]): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const getKeysFromObject = (obj: unknown, prefix = ''): string[] => {
	if (!isRecord(obj)) {
		throw new Error('getKeysFromObject: argument must be an object');
	}

	return Object.entries(obj).reduce<string[]>((keys, [ key, value ]) => {
		const fullKey = prefix ? `${ prefix }.${ key }` : key;
		return [
			...keys,
			fullKey,
			...isRecord(value)
				? getKeysFromObject(value, fullKey)
				: [],
			...Array.isArray(value) && value.length > 0 && isRecord(value[0])
				? value.reduce<string[]>((arrKeys, item, index) =>
					[ ...arrKeys, ...getKeysFromObject(item, `${ fullKey }.${ index }`) ], [])
				: [],
		];
	}, []);
};

export const useValidationKey = (obj: unknown) => getKeysFromObject(obj);

export const useValidation = <TSchema extends CustomSchema>(schema: MaybeRefOrGetter<TSchema>, data: MaybeRefOrGetter<Record<string, unknown>>) => {
	const silentErrors = ref<FlatErrors<TSchema>>();
	const output = ref<InferOutput<TSchema>>();
	const dirtyFields = ref<string[]>([]);
	const validDirtyFields = ref<string[]>([]);
	const customErrors = ref<Record<string, string>>({});

	const errors = computed(() => {
		const valibotErrors = Object.fromEntries(Object.entries(silentErrors.value?.nested ?? {})
			.filter(([ key ]) => isDirty(key) && !isDirtyAndValid(key))
			.map(([ key, value ]) => [ key, String(getFirstOfArray(value)) ]));
		return { ...valibotErrors, ...customErrors.value }; // Merge custom errors with Valibot errors
	});

	const makeFieldDirty = (name: string) => {
		dirtyFields.value = [ ...new Set([ ...dirtyFields.value, name ]) ];
		validDirtyFields.value = hasAnyError(name)
			? validDirtyFields.value.filter((field) => field !== name)
			: [ ...new Set([ ...validDirtyFields.value, name ]) ];
	};

	const cleanField = (name: string) => {
		dirtyFields.value = dirtyFields.value.filter((field) => field !== name);
		validDirtyFields.value = validDirtyFields.value.filter((field) => field !== name);
	};

	const makeFormDirty = () => {
		dirtyFields.value = getKeysFromObject(toValue(data));
		validDirtyFields.value = dirtyFields.value.filter((field) => !hasAnyError(field));
	};

	const cleanForm = () => {
		dirtyFields.value = [];
		validDirtyFields.value = [];
		customErrors.value = {};
	};

	const setCustomError = (field: string, message: string) => {
		customErrors.value = { ...customErrors.value, [field]: message };
	};

	const clearCustomError = (field: string) => {
		customErrors.value = omit(customErrors.value, [ field ]);
	};

	const clearAllCustomErrors = () => {
		customErrors.value = {};
	};

	const hasAnyError = (name: string) => Object.keys(silentErrors.value?.nested ?? {}).includes(name);
	const isDirty = (name: string) => dirtyFields.value.includes(name);
	const isDirtyAndValid = (name: string) => validDirtyFields.value.includes(name);

	const isFormValid = computed(() => silentErrors.value === undefined);

	const handleSubmit = async (
		onSubmit: (values: InferOutput<TSchema>) => Promise<void> | void,
		onError?: () => void,
	) => {
		makeFormDirty();
		await validate();
		return isFormValid.value
			? onSubmit(output.value)
			:	onError != null ? onError() : undefined;
	};

	const validate = async () => {
		const result = await safeParseAsync(toValue(schema), toValue(data), {
			abortPipeEarly: true,
		});
		silentErrors.value = !result.success ? flatten<TSchema>(result.issues) : undefined;
		output.value = result.output;
		return result;
	};

	watch([ () => toValue(schema), () => toValue(data) ], () => {
		validate();
	}, {
		immediate: true,
		deep: true,
	});

	return {
		validate,
		errors,
		silentErrors,
		output,
		dirtyFields,
		validDirtyFields,
		makeFieldDirty,
		makeFormDirty,
		cleanField,
		cleanForm,
		setCustomError,
		clearCustomError,
		clearAllCustomErrors,
		isDirty,
		isFormValid,
		handleSubmit,
	};
};
