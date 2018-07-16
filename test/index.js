const compile = require('../').compile;

console.log(compile(`
<div className="News">
    {
        newsMain ? (
            <div className="News-main">
                <a className="News-main-item" href={newsMain.url_1 || '/'} target="_blank">
                    <h2 className="News-title">{newsMain.title_main_1}</h2>
                    <p className="News-info">{newsMain.title_sec_1}</p>
                </a>
                <a className="News-main-item" href={newsMain.url_2 || '/'} target="_blank">
                    <h2 className="News-title">{newsMain.title_main_2}</h2>
                    <p className="News-info">{newsMain.title_sec_2}</p>
                </a>
                <a className="News-main-item" href={newsMain.url_3 || '/'} target="_blank">
                    <h2 className="News-title">{newsMain.title_main_3}</h2>
                    <p className="News-info">{newsMain.title_sec_3}</p>
                </a>
            </div>
        ) : <div className="News-main"></div>
    }
    <ul className="News-ls">
    {
        newsGeneral.map((it, idx) => (
            <li className="News-ls-item" key={\`\${idx}-\${it.preview_url}-\${it.cat_name}\`}>
                <em>[</em>
                <a className="News-ls-label">{it.cat_name || ''}</a>
                <em>]</em>
                <a className="News-ls-detail" href={it.preview_url || ''} target="_blank">{it.title || ''}</a>
            </li>
        ))
    }
    </ul>
</div>`));