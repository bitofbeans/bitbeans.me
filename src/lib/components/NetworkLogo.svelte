<script>
    let { activeTab = $bindable() } = $props()
</script>
<div class="network">
    <div class="tabs">
        <button id="about" onclick={() => activeTab = 'about'}>About</button>
        <button id="contact" onclick={() => activeTab = 'contact'}>Contact</button>
        <button id="work" onclick={() => activeTab = 'work'}>My work</button>
    </div>
    <svg class="logo" viewBox="225 190 555 580" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;">

        <g transform="matrix(0.962535,0,0,0.962535,98.962642,23.705111)">
            <g transform="matrix(1,0,0,0.828383,0,39.613861)">
                <path d="M170,225C261.777,228.159 355,232.243 355,232.243C355,232.243 461.612,361.736 480,413.319L476,647.51L370,827.2C370,827.2 263.224,829.491 182,828.987" style="fill:none;stroke:rgb(43,188,125);stroke-width:70.72px;"/>
            </g>
            <g>
                <g transform="matrix(1,0,0,1,15,18.5)">
                    <ellipse id="top" cx="171.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:rgb(43,188,125);stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,8.850814,266.369352)">
                    <ellipse id="middle" cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:rgb(43,188,125);stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,8.111729,518.766831)">
                    <ellipse id="bottom" cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:rgb(43,188,125);stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,378.403097,93.367538)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:rgb(43,188,125);stroke:white;stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,380.216318,480.184844)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:rgb(43,188,125);stroke:white;stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,476.182692,269.5)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:rgb(43,188,125);stroke:white;stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,379.703773,271.203866)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:rgb(43,188,125);stroke:white;stroke-width:64.93px;"/>
                </g>
                <g transform="matrix(1,0,0,1,302.518791,268.276191)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:rgb(43,188,125);stroke-width:64.93px;"/>
                </g>
            </g>
            <path d="M480,477L182,477" style="fill:none;stroke:rgb(43,188,125);stroke-width:64.93px;"/>
            <g transform="matrix(0.559696,-0.002224,-0.002224,0.999989,213.287301,1.077209)">
                <path d="M482,477L779,478.5" style="fill:none;stroke:white;stroke-width:80.34px;"/>
            </g>
            <g transform="matrix(1.000003,0.001016,0.001016,1.300672,27.572181,-112.141535)">
                <path d="M525,324L526,620" style="fill:none;stroke:white;stroke-width:55.92px;"/>
            </g>
        </g>
        <g transform="matrix(0.962535,0,0,0.962535,98.962642,23.705111)">
            <g transform="matrix(1,0,0,0.828383,0,39.613861)">
                <path d="M170,225C261.777,228.159 355,232.243 355,232.243C355,232.243 461.612,361.736 480,413.319L476,647.51L370,827.2C370,827.2 263.224,829.491 182,828.987" style="fill:none;stroke:black;stroke-width:35.36px;"/>
            </g>
            <g>
                <g transform="matrix(1,0,0,1,15,18.5)">
                    <ellipse cx="171.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,8.850814,266.369352)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,8.111729,518.766831)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,302.518791,268.276191)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,378.403097,93.367538)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,380.216318,480.184844)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,476.182692,269.5)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
                <g transform="matrix(1,0,0,1,379.703773,271.203866)">
                    <ellipse cx="174.5" cy="207.5" rx="19.5" ry="18.5" style="fill:none;stroke:black;stroke-width:32.47px;"/>
                </g>
            </g>
            <path d="M480,477L182,477" style="fill:none;stroke:black;stroke-width:32.47px;"/>
            <g transform="matrix(0.54715,-0.002287,-0.002287,0.999988,219.364851,1.107903)">
                <path d="M482,477L779,478.5" style="fill:none;stroke:black;stroke-width:40.39px;"/>
            </g>
            <g transform="matrix(1.000003,0.001016,0.001016,1.300672,27.572181,-112.141535)">
                <path d="M525,324L526,620" style="fill:none;stroke:black;stroke-width:27.96px;"/>
            </g>
        </g>
    </svg>
</div>