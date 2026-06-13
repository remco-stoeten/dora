import { ChangelogTimeline } from '@/components/changelog-timeline'
import { ResourcesPageShell } from '@/components/resources-page-shell'
import {
    CHANGELOG_RELEASES,
    CURRENT_VERSION
} from '@/core/content/changelog-data'

export default function ChangelogView() {
    return (
        <ResourcesPageShell
            eyebrow="Changelog"
            title="Dora changelog"
            lead={`Release notes for Dora v${CURRENT_VERSION} and earlier versions, synced from shipped desktop builds.`}
        >
            <ChangelogTimeline releases={CHANGELOG_RELEASES} />
        </ResourcesPageShell>
    )
}
