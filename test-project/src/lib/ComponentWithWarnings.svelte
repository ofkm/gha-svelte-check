<script lang="ts">
  // WARNING: Using 'any' type
  let data: any = 'some data';

  // WARNING: Unused import
  import { onMount, createEventDispatcher } from 'svelte';

  // WARNING: Unused variable
  let unusedVariable = "I'm not used anywhere";

  // WARNING: Implicit any
  function processData(input) {
    // Missing type annotation
    return input.toString();
  }

  let value = '';

  // WARNING: Unsafe type assertion
  function handleInput(event: Event) {
    value = (event.target as any).value; // Could use HTMLInputElement instead
  }

  // WARNING: Non-null assertion without check
  let element: HTMLElement | null = null;
  function useElement() {
    element!.focus(); // Using non-null assertion without null check
  }
</script>

<div>
  <h2>Component with Warnings</h2>
  <input on:input={handleInput} bind:value />
  <p>Value: {value}</p>
  <p>Data: {data}</p>
  <button onclick={useElement}>Focus element</button>
</div>
