<svg id="jira_app_header_skeleton" class="aui-header-primary" width="100%" height="40" xmlns="http://www.w3.org/2000/svg">
    <style>
        #mask {
            animation: mask 0.8s forwards linear infinite;
        }

        @keyframes mask {
            from {
                transform: translateX(0)
            }
            to {
                transform: translateX(100%)
            }
        }
    </style>
</svg>
<script>
    const jiraAppHeaderSkeletonSvg = document.querySelector('#jira_app_header_skeleton');
    jiraAppHeaderSkeletonSvg.setAttribute('width', __jiraAppHeaderSkeleton.headerWidth);
    jiraAppHeaderSkeletonSvg.innerHTML += __jiraAppHeaderSkeleton.headerSvg;
</script>
