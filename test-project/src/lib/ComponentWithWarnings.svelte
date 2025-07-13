<script lang="ts">
  // WARNING: Using 'any' type
  let data: any = 'some data';

  // WARNING: Unused import
  import { onMount, createEventDispatcher } from 'svelte';

  // WARNING: Unused variable
  let unusedVariable = "I'm not used anywhere";

  // WARNING: Implicit any - REMOVE the type annotation to make it implicit
  function processData(input) {
    return input.toString();
  }

  let value = '';

  // WARNING: Unsafe type assertion
  function handleInput(event: Event) {
    value = (event.target as any).value;
  }

  // WARNING: Non-null assertion without check
  let element: HTMLElement | null = null;
  function useElement() {
    element!.focus(); // Using non-null assertion without null check
  }
</script>

<div>
  <h2>Component with Warnings</h2>
  <input oninput={handleInput} bind:value />
  <p>Value: {value}</p>
  <p>Data: {data}</p>
  <button onclick={useElement}>Focus element</button>
</div>
