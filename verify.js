const Joi = require("joi");

const schema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),

  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),

  repeat_password: Joi.ref("password"),

  access_token: [Joi.string(), Joi.number()],
  hh:Joi.string().required(),

  birth_year: Joi.number().integer().min(1900).max(2013),

  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),
})
  .with("username", "birth_year")
  .xor("password", "access_token")
  .with("password", "repeat_password");

a  = schema.validate({ username: "abc" },{abortEarly:false});
// -> { value: { username: 'abc', birth_year: 1994 } }

// let  a = schema.validate({});
console.log(a.error.annotate())
