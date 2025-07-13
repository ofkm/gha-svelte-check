<script lang="ts">
  // HINT: Variable declared but never used
  let hintVariable = "I'm declared but never used";

  // HINT: Function declared but never used
  function unusedFunction() {
    return "I'm never called";
  }

  let activeCount = 0;

  function increment() {
    activeCount++;
  }
</script>

<div>
  <h2>Component with Hints</h2>
  <p>Active count: {activeCount}</p>
  <button onclick={increment}>Increment</button>
</div>
