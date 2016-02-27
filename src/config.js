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
          required: "required",
        }
      },
      {
        type:"input",
        label:"Username:",
        appKey:"USERNAME"
      },
      {
        type:"input",
        label:"Password:",
        appKey:"PASSWORD",
        attributes : {
          placeholder : "eg: name@domain.com",
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