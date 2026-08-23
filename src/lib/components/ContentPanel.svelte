<script>
    import About from "./content/About.svelte";
    import Contact from "./content/Contact.svelte";
    import Work from "./content/Work.svelte";
    
    
    const tabs = { about: About, work: Work, contact: Contact }
    let { activeTab } = $props()
</script>
<div class="content-container">
    {#if tabs[activeTab]}
        {@const Tab = tabs[activeTab]}
        <Tab />
    {/if}
</div>