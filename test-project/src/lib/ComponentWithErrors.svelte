<script lang="ts">
  import ComponentWithErrors from '$lib/ComponentWithErrors.svelte';
  import ComponentWithWarnings from '$lib/ComponentWithWarnings.svelte';
  import ComponentWithHints from '$lib/ComponentWithHints.svelte';

  let count: number = 0;

  function increment() {
    count += 1;
  }

  // ERROR: Type mismatch
  let message: string = 123; // Error: Type 'number' is not assignable to type 'string'

  interface User {
    name: string;
    age: number;
  }

  // ERROR: Missing required property
  let user: User = {
    name: 'John',
    // Missing age property - this will cause an error
  };

  // ERROR: Using undefined function
  function handleClick() {
    undefinedFunction(); // Error: Cannot find name 'undefinedFunction'
  }
</script>

<h1>Test SvelteKit App</h1>
<p>Count: {count}</p>
<button onclick={increment}>Increment</button>

<ComponentWithErrors />
<ComponentWithWarnings />
<ComponentWithHints />

<div>
  <h2>Component with Errors</h2>
  <p>{message}</p>
  <p>User: {user.name}</p>
  <button onclick={handleClick}>Click me</button>
</div>
