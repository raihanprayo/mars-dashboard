const { program } = require("commander");
const PackCmd = require("./commands/pack");
const ZipCmd = require("./commands/zip");

program.addCommand(PackCmd).addCommand(ZipCmd).parse();
