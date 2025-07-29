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

* `data: MaybeRefOrGetter<InferInput<TSchema>>`
  The reactive object that holds the form data to be validated.

#### Returns

```ts
{
  handleSubmit: (onSubmit, onError?) => Promise<void>;
  errors: ComputedRef<Record<string, string>>;
  output: Ref<InferOutput<TSchema> | undefined>;

  makeFieldDirty: (name: string) => void;
  cleanField: (name: string) => void;
  makeFormDirty: () => void;
  cleanForm: () => void;

  setCustomError: (field: string, message: string) => void;
  clearCustomError: (field: string) => void;
  clearAllCustomErrors: () => void;

  validate: () => Promise<SafeParseReturn<TSchema>>;
  silentErrors: Ref<FlatErrors<TSchema> | undefined>;
  isDirty: (name: string) => boolean;
  isFormValid: ComputedRef<boolean>;
  dirtyFields: Ref<string[]>;
  validDirtyFields: Ref<string[]>;
}
```

---

## 🧠 Behavior Summary

* **Validation**: Runs automatically on schema/data changes and can be manually triggered via `validate()`.
* **Dirty tracking**: Optionally tracks which fields have been interacted with via `makeFieldDirty()`, `makeFormDirty()` and `cleanField()`.
* **Custom errors**: Allows adding external (non-schema) validation messages using `setCustomError()` etc.

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

```vue
<script setup lang="ts">
import { ref } from 'vue'
import * as v from 'valibot'
import { useValidation } from '@adbros/vue-validation'

const schema = v.object({
  username: v.pipe(
    v.string(),
    v.nonEmpty('Zadejte uživatelské jméno.')
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Zadejte heslo.')
  ),
})

const form = ref({
  username: '',
  password: '',
})

const {
  errors,
  makeFieldDirty,
  handleSubmit,
} = useValidation(schema, form)

const submitForm = handleSubmit(
  (values) => {
    console.log('Success:', values);
  },
  () => {
    console.warn('Form has errors', errors.value)
  }
)
</script>

<template>
  <form @submit.prevent="submitForm">
    <label>
      Uživatelské jméno
      <input
        v-model="form.username"
        @blur="makeFieldDirty('username')"
      />
      <span class="error" v-if="errors.username">{{ errors.username }}</span>
    </label>

    <label>
      Heslo
      <input
        type="password"
        v-model="form.password"
        @blur="makeFieldDirty('password')"
      />
      <span class="error" v-if="errors.password">{{ errors.password }}</span>
    </label>

    <button type="submit">Přihlásit se</button>
  </form>
</template>
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
