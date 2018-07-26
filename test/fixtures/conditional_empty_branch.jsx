<div>
    { a ? <div>{a}</div> : null}
    { a ? '' : <div>alternate</div>}
    <div attr={`${a ? <div>{a}</div> : ""}`}>hello</div>
    { a ? a : undefined}
</div>