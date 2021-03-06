// We import modules.
const url = require("url");
const path = require("path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const GuildSettings = require("../models/settings");

// We instantiate express app and the session store.
const app = express();
const MemoryStore = require("memorystore")(session);

// We export the dashboard as a function which we call in ready event.
module.exports = async client => {
  // We declare absolute paths.
  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`); // Absolute path of ./templates directory.

  // Deserializing and serializing users without any additional logic.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
  // If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
  // Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http

  var callbackUrl;
  var domain;

  try {
    const domainUrl = new URL(process.env.domain);
    domain = {
      host: domainUrl.hostname,
      protocol: domainUrl.protocol
    };
  } catch (e) {
    console.log(e);
    throw new TypeError("Invalid domain specific in the config file.");
  }

  if (process.env.usingCustomDomain) {
    callbackUrl = `${domain.protocol}//${domain.host}/callback`;
  } else {
    callbackUrl = `${domain.protocol}//${domain.host}${
      process.env.port == 80 ? "" : `:${process.env.port}`
    }/callback`;
  }

  // This line is to inform users where the system will begin redirecting the users.
  // And can be removed.
  console.log("===");
  console.log(
    `Info: Make sure you have added the following url to the discord's OAuth callback url section in the developer portal:\n${callbackUrl}`
  );
  console.log("===");

  // We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
  /** Scopes:
   *  - Identify: Avatar's url, username and discriminator.
   *  - Guilds: A list of partial guilds.
   */
  passport.use(
    new Strategy(
      {
        clientID: process.env.id,
        clientSecret: process.env.clientSecret,
        callbackURL: callbackUrl,
        scope: ["identify", "guilds"]
      },
      (accessToken, refreshToken, profile, done) => {
        // eslint-disable-line no-unused-vars
        // On login we pass in profile with no logic.
        process.nextTick(() => done(null, profile));
      }
    )
  );

  // We initialize the memorystore middleware with our express app.
  app.use(
    session({
      store: new MemoryStore({ checkPeriod: 86400000 }),
      secret:
        "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
      resave: false,
      saveUninitialized: false
    })
  );

  // We initialize passport middleware.
  app.use(passport.initialize());
  app.use(passport.session());

  // We bind the domain.
  app.locals.domain = process.env.domain.split("//")[1];

  app.set("view engine", "ejs");

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );

  // We host all of the files in the assets using their name in the root address.
  // A style.css file will be located at http://<your url>/style.css
  // You can link it in any template using src="/assets/filename.extension"
  app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));

  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderTemplate = (res, req, template, data = {}) => {
    const botInfo = {
      username: client.user.username,
      status: client.user.presence.status,
      users: client.users.cache.size,
      
      guilds: client.guilds.cache.size
    };

   
    // Default base data which passed to the ejs template by default.
    const baseData = {
      bot: client,
      botInfo: botInfo,
      success: false,
      profile: req.isAuthenticated() ? req.user : null,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null,
    };


    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(baseData, data)
    );
  };

  // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
  const checkAuth = (req, res, next) => {
    // If authenticated we forward the request further in the route.
    if (req.isAuthenticated()) return next();
    // If not authenticated, we set the url the user is redirected to into the memory.
    req.session.backURL = req.url;
    // We redirect user to login endpoint/route.
    res.redirect("/login");
  };

  // Login endpoint.
  app.get("/login", (req, res, next) => {
    // We determine the returning url.
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL; // eslint-disable-line no-self-assign
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    // Forward the request to the passport middleware.
    res.redirect("https://api.dismic.org/v1/auth/login");
  });

  // Callback endpoint.
  app.get(
    "/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    /* We authenticate the user, if user canceled we redirect him to index. */ (
      req,
      res
    ) => {
      // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
      if (req.session.backURL) {
        const url = req.session.backURL;
        req.session.backURL = null;
        res.redirect(url);
      } else {
        res.redirect("/");
      }
    }
  );

  // Logout endpoint.

  // Index endpoint.
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });

  app.get("/support", (req, res) => {
    res.redirect("https://discord.gg/invite/95QvjUn9pd");
  });
  
   app.get("/botping", (req, res) => {
    res.send("Bot is online!")
  });

  // Dashboard endpoint.
  app.get("/guilds", checkAuth, (req, res) => {
    renderTemplate(res, req, "guilds.ejs", { perms: Discord.Permissions });
  });

  app.get("/premium", checkAuth, (req, res) => {
    renderTemplate(res, req, "premium.ejs", { perms: Discord.Permissions });
  });

  app.get("/commands", checkAuth, (req, res) => {
    renderTemplate(res, req, "commands.ejs", { perms: Discord.Permissions, commands: client.commands, prefix: "!" });
  });

  app.get("/guild/:guildID", checkAuth, async (req, res) => {
    res.redirect("/guild/" + req.params.guildID + "/general");
  });
  // Settings endpoint.
  app.get("/guild/:guildID/general", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/guilds");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/guilds");
    if (!member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) return res.redirect("/guilds");

    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }

    renderTemplate(res, req, "general.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
      gid: req.params.guildID,
      nickname: guild.members.cache.get(client.user.id).displayName,
      premium: storedSettings.premium,
      loglink: "/guild/" + guild.id + "/logging",
      moderationlink: "/guild/" + guild.id + "/moderation"
    });
  });

  // Settings endpoint.
  app.post("/guild/:guildID/general", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/guilds");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/guilds");
    if (!member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) return res.redirect("/guilds");
    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }

    // We set the prefix of the server settings to the one that was sent in request from the form.
    storedSettings.prefix = req.body.prefix;
    guild.members.cache.get(client.user.id).setNickname(req.body.nickname);
    // We save the settings.
    await storedSettings.save().catch(() => {});

    // We render the template with an alert text which confirms that settings have been saved.
    renderTemplate(res, req, "general.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your settings have been saved.",
      gid: req.params.guildID,
      nickname: req.body.nickname,
      premium: storedSettings.premium
    });
  });

  app.get("/guild/:guildID/logging", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/guilds");
    const member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/guilds");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/guilds");

    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }

    renderTemplate(res, req, "logging.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your settings have been saved.",
      joinmsg: storedSettings.joinmsg,
      premium: storedSettings.premium
    });
  });

  // Settings endpoint.
  app.post("/guild/:guildID/logging", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/guilds");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/guilds");
    if (!member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) return res.redirect("/guilds");
    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }

    if (req.body.checkAddress == "on") {
      storedSettings.joinon = true;
    } else {
      storedSettings.joinon = false;
    }

    // We set the prefix of the server settings to the one that was sent in request from the form.
    storedSettings.joinmsg = req.body.joinmsg;
    storedSettings.joinchannel = req.body.joinchannel;

    // We save the settings.
    await storedSettings.save().catch(() => {});

    // We render the template with an alert text which confirms that settings have been saved.
    renderTemplate(res, req, "logging.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your settings have been saved.",
      joinmsg: storedSettings.joinmsg,
      premium: storedSettings.premium
    });
  });

  app.get("/logout", function(req, res) {
    // We destroy the session.
    req.session.destroy(() => {
      // We logout the user.
      req.logout();
      // We redirect user to index.
      res.redirect("/");
    });
  });

  app.use(function(req, res, next) {
    res.status(404);
    let data = {
      code: 404,
      url: "https://dashboard.dismic.org/",
      shortDescription: "Not found",
      description: "The page you're looking for can't be found."
    };
    renderTemplate(res, req, "404.ejs", data);
  });

  app.listen(process.env.port, null, null, () =>
    console.log(`Dashboard is up and running on port ${process.env.port}.`)
  );
};
