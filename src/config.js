module.exports = [
  {
    type:"heading", defaultValue:"Log in to Jive", size:"1"
  },
  {
    type:"section", items:[
      {
        type : "input",
        label : "Jive URL",
        appKey : "JIVEURL",
        attributes : {
          placeholder : "example.jiveon.com",
          required: "required"
        }
      },
      {
        type:"input",
        label:"Username:",
        appKey:"USERNAME",
        attributes : {
          placeholder : "Username",
          required: "required",
          type: "text"
        }
      },
      {
        type:"input",
        label:"Password:",
        appKey:"PASSWORD",
        attributes : {
          placeholder : "Password",
          required: "required",
          type: "password"
        }
      }
    ]
  },
  {
    type:"submit", defaultValue:"Submit"
  }
];