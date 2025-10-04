<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '$lib/styles/global.css';
  import { page } from '$app/stores';
</script>

<div class="app-container" key={$page.url.pathname}>

  <Navbar />

  <Sidebar />

  <main class="main-content">
    <slot />
  </main>

  <Footer />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  
  :global(nav) {
    margin-left: 220px;
    width: calc(100% - 220px);
  }

  
  .main-content {
    margin-left: 220px;
    padding: 1rem;
    flex: 1;
  }
  
</style>
