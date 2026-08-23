<script>
    import ContentPanel from "./lib/components/ContentPanel.svelte";
    import NetworkLogo from "./lib/components/NetworkLogo.svelte";

    let activeTab = $state('about');
</script>

<main>

    <NetworkLogo bind:activeTab={activeTab} />
    <ContentPanel { activeTab } />
</main>