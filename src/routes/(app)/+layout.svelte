<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '$lib/styles/global.css';

  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';

  onMount(() => {
    // Opcional: qualquer inicialização global
    console.log('Layout montado — todas as rotas terão preload automático.');
  });

  // Reset suave de scroll entre páginas
  afterNavigate(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
</script>

<!-- Layout persistente -->
<div
  class="app-shell"
  data-sveltekit-preload-data="eager"
  data-sveltekit-preload-code="eager"
>
  <Sidebar />
  <div class="content-area">
    <Navbar />
    <main class="main">
      <slot />
    </main>
    <Footer />
  </div>
</div>

<style>
  /* GRID fixo e estável */
  .app-shell {
    display: grid;
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto 1fr auto;
    min-height: 100dvh;
    background: #f0f2f5;
  }

  :global(.sidebar) {
    grid-column: 1 / 2;
    grid-row: 1 / 4;
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    background: #fff;
    border-right: 1px solid #e5e7eb;
  }

  .content-area {
    grid-column: 2 / 3;
    grid-row: 1 / 4;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-width: 0;
  }

  :global(nav) {
    grid-row: 1;
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .main {
    grid-row: 2;
    padding: 1rem;
    overflow: auto;
    min-width: 0;
  }

  :global(footer) {
    grid-row: 3;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
  }
</style>
