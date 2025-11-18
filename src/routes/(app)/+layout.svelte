<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import GlobalFeedback from '$lib/components/GlobalFeedback.svelte';
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import '$lib/styles/global.css';

  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';

  onMount(() => {
    // Layout inicializado
  });

  afterNavigate(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
</script>

<div class="app-shell">
  <Sidebar />
  <div class="content-area">
    <Navbar />
    <main class="main">
      <slot />
    </main>
    <Footer />

    <!-- 💬 Feedback Global -->
    <GlobalFeedback />
    
    <!-- 🍞 Toast Container -->
    <ToastContainer />
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100vh;
    background: #f0f2f5;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 260px;
    transition: margin-left 0.3s ease;
  }

  .main {
    flex: 1;
    overflow: auto;
    padding: 0;
  }

  /* Responsive */
  @media (max-width: 920px) {
    .content-area {
      margin-left: 0;
    }
  }
</style>
