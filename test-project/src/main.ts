import { run } from "./adapters/cli.js";

const result = run(process.argv.slice(2));
console.log(result.out);
process.exit(result.code);
