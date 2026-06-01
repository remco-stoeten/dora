import {
    CHANGELOG_RELEASES,
    CURRENT_VERSION
} from '@/core/content/changelog-data'

function formatDate(dateString: string): string {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}

export default function ChangelogView() {
    return (
        <main className="content-page">
            <p className="eyebrow">Changelog</p>
            <h1>Dora changelog</h1>
            <p className="lead">
                Release notes for Dora v{CURRENT_VERSION} and earlier
                versions, synced from shipped desktop builds.
            </p>

            <div className="changelog-timeline">
                {CHANGELOG_RELEASES.map(function (release, index) {
                    const isLatest = index === 0

                    return (
                        <article
                            key={release.version}
                            className="changelog-release"
                            id={`v${release.version}`}
                        >
                            <header className="changelog-release-header">
                                <div className="changelog-release-title">
                                    <h2>v{release.version}</h2>
                                    {isLatest ? (
                                        <span className="changelog-badge">
                                            Latest release
                                        </span>
                                    ) : null}
                                </div>
                                <div className="changelog-release-meta">
                                    <time dateTime={release.date}>
                                        {formatDate(release.date)}
                                    </time>
                                    <a
                                        href={release.tagUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View on GitHub
                                    </a>
                                </div>
                            </header>

                            <div className="changelog-groups">
                                {release.groups.map(function (group) {
                                    return (
                                        <section
                                            key={`${release.version}-${group.name}`}
                                            className="changelog-group"
                                        >
                                            <h3>{group.name}</h3>
                                            <ul className="content-list">
                                                {group.items.map(function (
                                                    item
                                                ) {
                                                    return (
                                                        <li key={item}>
                                                            {item}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </section>
                                    )
                                })}
                            </div>
                        </article>
                    )
                })}
            </div>
        </main>
    )
}
