import React from "react";
import './App.css';

import Web3 from "web3";
import { Button, Col, Input, InputGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTimes} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

let web3;
const erc721 = require("./abi/ERC-721.json");
class App extends React.Component {
  constructor(props) {    
    super(props)
    this.handleChangeSource = this.handleChangeSource.bind(this)
    this.handleChangeID = this.handleChangeID.bind(this)
    this.handleselectedFile = this.handleselectedFile.bind(this)
    this.state = {
      web3: "",
      image: "",
      image_name: "",
      account: "",
      account_short: "",
      owner: "",
      owner_short: "",
      source: "",
      id: "",
      idlength: "",
      blocknumber: "",
      name: "",
      signature_active: false,
      source_check: true
    }
  }
  componentDidMount() {
    this.startEth();
    try {
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", () => {
          this.startEth();
        })
        window.ethereum.on("chainChanged", () => {
          this.startEth();
        })
      }
    } catch (e) {console.log("no window.ethereum")}
  }
  async startEth () {
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false
      web3 = new Web3(window.ethereum);
      try {
        let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        let account = web3.utils.toChecksumAddress(accounts[0])
        this.setState({ account: account })
        let account_short = account.substring(0, 6) + "..." + account.substring(38, 42)
        this.setState({ account_short: account_short })
      } catch(e) {
        try {
        let accounts = await web3.eth.getAccounts()
        let account = web3.utils.toChecksumAddress(accounts[0])
        this.setState({ account: account })
        let account_short = account.substring(0, 6) + "..." + account.substring(38, 42)
        this.setState({ account_short: account_short })
        } catch(e) {
          console.log("No web3 injected")
        }
      }
    } else {
      this.setState({web3: "No web3 connection found"})
    }
  }
  handleChangeSource(e) {
    this.setState({source: e.target.value})
  }
  handleChangeID(e) {
    this.setState({id: e.target.value})
    this.setState({idlength: e.target.value.length})
  }
  handleselectedFile(e) {
    try {   
      this.setState({image: URL.createObjectURL(e.target.files[0])})
      let name = e.target.files[0].name
      this.setState({image_name: name})
      let pre_name = name.substring(0, 4)
      if (pre_name === "src+") {
        let source = name.substring(4, 46)
        this.setState({source: source})
        let mid_name = name.substring(46, 50)
        if (mid_name === "_id+") {
          let i = 0
          let end = false
          let length = ""
          let begin = 50
          while (i < 50 && end === false) {
            let current = name.substring(begin, begin+1)
            if (current !== "+") {
              length += current
              begin += 1
            } else {
              end = true
            }
            i += 1
          }
          let id = name.substring(50+i, 50+i+parseInt(length))
          this.setState({id: id})
          this.setState({idlength: length})
          let total = name.length
          let newname = name.substring(50+i+parseInt(length)+1, total)
          this.setState({image_name: newname})
        }
      } 
    } catch {
      console.log("upload failed")
    }
  }
  async getSignature () {
    try {
      let NFT = await new web3.eth.Contract(erc721.abi, this.state.source) 
      this.setState({source_check: true})
      this.setState({signature_active: true})
      let blocknumber = await web3.eth.getBlockNumber()
      this.setState({blocknumber: blocknumber})
      let owner = await NFT.methods.ownerOf(this.state.id).call()
      this.setState({owner: owner})
      let owner_short = owner.substring(0, 6) + "..." + owner.substring(38, 42)
      this.setState({owner_short: owner_short})
      let name = await NFT.methods.name().call()
      this.setState({name: name})
    } catch(e) {
      console.log("False source")
      this.setState({source_check: false})
    }
  }
  download() {
    const url = this.state.image
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "src+"+this.state.source+"_id+"+this.state.idlength+"+"+this.state.id+"_"+this.state.image_name)
    document.body.appendChild(link)
    link.click()
  }
  render() {
    let signature
    if (this.state.signature_active) {
      if (this.state.source_check === false){
        signature =
          <p className="text-danger">
            <FontAwesomeIcon icon={faTimes} />{" "} False source 
          </p>
      } else {
        if (this.state.owner === this.state.account) {
          signature =
          <div>
            <p className="text-success">
              <FontAwesomeIcon icon={faCheck} />{" "}{this.state.owner_short} is the owner of the {this.state.name} per block {this.state.blocknumber}  
            </p>
            <Button onClick={() => this.download()}>Download</Button>
          </div>
        } else  {
          signature =
          <p className="text-danger">
            <FontAwesomeIcon icon={faTimes} />{" "}{this.state.account_short} is not the owner per block {this.state.blocknumber}  
          </p>
        } 
      }
    }
    return (
      <div className="App">
        <header className="App-header">
          <div style={{position: 'absolute', right: 20, bottom: 10,}}>
            <a href="https://github.com/keviinfoes">
              <FontAwesomeIcon icon={faGithub} /> 
            </a>
          </div>
          <input type="file" onChange={this.handleselectedFile} />         
          <img src={this.state.image} className="App-logo" alt=""></img>
          <p></p><p></p>
            <Col lg="8">
              <InputGroup>
                <Input 
                  className="text-right w-25"
                  placeholder="Source address"
                  value={this.state.source}
                  type="text"
                  onChange={this.handleChangeSource}
                />
                <Input 
                  className="text-right"
                  placeholder="ID"
                  value={this.state.id}
                  type="text"
                  onChange={this.handleChangeID}
                />
                <Button 
                onClick={() => this.getSignature()}
                >
                Get signature
                </Button>
              </InputGroup>
            </Col>
          <p></p>
          {signature}
          <p className="text-danger">
            {this.state.web3}
          </p>        
        </header>
      </div>
    );
  }
}

export default App;
