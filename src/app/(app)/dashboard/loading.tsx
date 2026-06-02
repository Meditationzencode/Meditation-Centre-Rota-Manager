// Skeleton mirroring the portal dashboard layout. Styles come from
// portal.css (imported by the (app) layout), so the tokens are in scope.

export default function DashboardLoading() {
  return (
    <>
      <header className="topbar">
        <div>
          <span className="sk" style={{ width: 160, height: 15, marginBottom: 12 }} />
          <span className="sk" style={{ width: 'min(360px, 70vw)', height: 44 }} />
        </div>
      </header>

      <section className="rhythm" style={{ alignItems: 'center' }}>
        <div className="rhythm__lead">
          <span className="sk rhythm__leaf" />
          <span className="sk" style={{ width: 100, height: 38 }} />
        </div>
        <div className="rhythm__items">
          {[0, 1, 2, 3].map(i => (
            <div className="rhythm__item" key={i}>
              <span className="sk" style={{ width: 44, height: 44, borderRadius: 999 }} />
              <span className="sk" style={{ width: 88, height: 30 }} />
            </div>
          ))}
        </div>
      </section>

      <section className="statgrid">
        {[0, 1, 2, 3].map(i => (
          <div className="statcard" key={i}>
            <div className="statcard__top">
              <span className="sk" style={{ width: 46, height: 46, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <span className="sk" style={{ width: '70%', height: 13, marginBottom: 10 }} />
                <span className="sk" style={{ width: 56, height: 34 }} />
              </div>
            </div>
            <span className="sk" style={{ width: '50%', height: 12, marginTop: 18 }} />
          </div>
        ))}
      </section>

      <section className="contentgrid">
        {[0, 1].map(i => (
          <div className="panel" key={i}>
            <div className="panel__head">
              <span className="sk" style={{ width: 200, height: 26 }} />
              <span className="sk" style={{ width: 96, height: 32, borderRadius: 999 }} />
            </div>
            {[0, 1, 2, 3].map(j => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
                <span className="sk" style={{ width: 42, height: 42, borderRadius: 999 }} />
                <div style={{ flex: 1 }}>
                  <span className="sk" style={{ width: '60%', height: 15, marginBottom: 8 }} />
                  <span className="sk" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  )
}
