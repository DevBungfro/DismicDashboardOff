// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const guildSettingSchema = new Schema({
  gid: { type: String },
  prefix: { type: String, default: "!" },
  premiums: { type: Number, default: 0 },
  joinmsg: { type: String, default: "Welcome %user% to %guild%!" },
  joinchannel: { type: String, default: "None" },
  joinon: { type: Boolean, default: false },
  premium: { type: Boolean, default: false }
});

// We export it as a mongoose model.
module.exports = model("guild_settings", guildSettingSchema);