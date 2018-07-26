<div>
    <div>{a && b}</div>
    <div>{b && <div>{b}</div>}</div>
    <div>{c || 'alternate'}</div>
    <div>{d || <div>{e && f}</div>}</div>
</div>