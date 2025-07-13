<script lang="ts">
  import ComponentWithErrors from '$lib/ComponentWithErrors.svelte';
  import ComponentWithWarnings from '$lib/ComponentWithWarnings.svelte';
  import ComponentWithHints from '$lib/ComponentWithHints.svelte';

  let count: number = 0;

  function increment() {
    count += 1;
  }
</script>

<h1>Test SvelteKit App</h1>
<p>Count: {count}</p>
<button onclick={increment}>Increment</button>

<ComponentWithErrors />
<ComponentWithWarnings />
<ComponentWithHints />
