<script>
  import GlobalFeedback from '$lib/components/GlobalFeedback.svelte';
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import '$lib/styles/global.css';
</script>

<slot />
<GlobalFeedback />
<ToastContainer />
