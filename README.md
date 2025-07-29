# 📋 `@adbros/vue-validation`

A flexible, schema-driven form validation composable for Vue 3 using **Valibot**, with support for:

* Deeply nested schemas
* Dirty field tracking
* Custom errors
* Full form or per-field validation
* `MaybeRefOrGetter` inputs
* Composable-first design (external state as source of truth)
* "Reward early, punish late" validation behavior

---

## 🧩 Components

### 🔹 `useValidation<TSchema>()`

#### Parameters

* `schema: MaybeRefOrGetter<TSchema>`
  A Valibot schema (`BaseSchema` or `BaseSchemaAsync`) defining the structure and rules for validation.

* `data: MaybeRefOrGetter<Record<string, unknown>>`
  The reactive object that holds the form data to be validated.

#### Returns

```ts
{
  validate: () => Promise<SafeParseReturn<TSchema>>;
  handleSubmit: (onSubmit, onError?) => Promise<void>;
  errors: ComputedRef<Record<string, string>>;
  silentErrors: Ref<FlatErrors<TSchema> | undefined>;
  output: Ref<InferOutput<TSchema> | undefined>;

  dirtyFields: Ref<string[]>;
  validDirtyFields: Ref<string[]>;

  makeFieldDirty: (name: string) => void;
  cleanField: (name: string) => void;
  makeFormDirty: () => void;
  cleanForm: () => void;

  setCustomError: (field: string, message: string) => void;
  clearCustomError: (field: string) => void;
  clearAllCustomErrors: () => void;

  isDirty: (name: string) => boolean;
  isFormValid: ComputedRef<boolean>;
}
```

---

## 🧠 Behavior Summary

* **Validation**: Runs automatically on schema/data changes and can be manually triggered via `validate()`.
* **Dirty tracking**: Tracks which fields have been interacted with via `makeFieldDirty()`, `makeFormDirty()` and `cleanField()`.
* **Custom errors**: Allows adding external (non-schema) validation messages using `setCustomError()` etc.
* **Output**: On success, `output.value` contains the parsed, typed data from Valibot.

---

## 📦 Utility Functions

### 🔹 `useValidationKey(obj: unknown): string[]`

Traverses a deeply nested object (including objects in arrays) and returns a flat list of dot-notated field keys.

**Example output:**

```ts
const obj = { user: { name: '', address: { street: '' } } };
// → ["user.name", "user.address.street"]
```

---

## 🔸 Key Concepts

### ✅ Dirty State

* Fields become **dirty** via:

  * `makeFieldDirty(name)`
  * `makeFormDirty()` (marks *all* fields dirty)
* A dirty field is considered **valid** if no Valibot error exists for it.

### ❌ Error Reporting

* Errors are a computed merge of:

  * Valibot field-level errors (only for dirty + invalid fields)
  * Manually set `customErrors`

---

## 📥 `handleSubmit(onSubmit, onError?)`

Triggers a full validation of the form and invokes the `onSubmit` callback if validation passes. Optionally calls `onError()` if the form is invalid.

```ts
await handleSubmit(
  async (data) => {
    // Do something with validated `data`
  },
  () => {
    // Optional error handler
  }
)
```

---

## ✏️ Example Usage

```ts
const schema = v.object({
  name: string(),
  email: string([ minLength(5), pattern(/@/) ]),
});

const formData = ref({ name: '', email: '' });

const {
  errors,
  handleSubmit,
  makeFieldDirty,
} = useValidation(schema, formData);

const onSubmit = async (data) => {
  console.log('Valid form submission', data);
};
```

---

## 🔄 Auto Validation

The schema and data are both **deeply watched**, meaning any change triggers validation automatically unless throttled externally.

---

## 🔐 Type Safety

* Fully type-safe thanks to `InferOutput<TSchema>` and Valibot's schema inference.
* Validation schema and input are treated as generic inputs (`TSchema`), enabling reusable, scalable logic across forms.

---

## 💡 Notes

* You can control the timing and granularity of field validation using your own inputs, e.g., `@blur` or `@change` events.
* Form state (data) is kept external and not mutated internally.
* This approach is ideal for decoupled forms, such as those using Vue's Composition API and `<script setup>` pattern.
