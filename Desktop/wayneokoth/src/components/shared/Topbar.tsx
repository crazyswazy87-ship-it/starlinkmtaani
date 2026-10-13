import logoo from "../../../public/assets/bitth.png"
import sign from "../../../public/assets/cart.png"


const Topbar = () => {
  return (
    <>
    <div className="topbar">


    <div>
      <img 
        src={logoo}
        alt="logo"
        
        className="genn"
      />
    </div>

    <span className="dongaa">
      B.I.T.H 
    </span>

    <div className="donjo">
      <img 
        src={sign}
        alt="logo"
        className="germ"
      />
    </div>
    </div>
    </>
  )
}

export default Topbar