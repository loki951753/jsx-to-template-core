import React from 'react'

const Header = ()=>{
    return (
        // @jsx2tpl:Header
        <header>I am title</header>
    )
}

const MainSection = ()=>{
    return (
        // @jsx2tpl:MainSection
        <section>I am main section</section>
    )
}

const App = () => (
  // @jsx2tpl:App, data:data, mount:#root
  <div>
    <Header />
    <MainSection />
  </div>
)

export default App