<div>
    {
        a.map((item, index)=><ul>{index}{item.map(_item=><li>{_item}</li>)}</ul>)
    }
</div>