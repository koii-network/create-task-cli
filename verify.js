const prompts = require('prompts');
async function t() {
  const mode = (
    await prompts({
      type: "select",
      name: "mode",
      message: "Select field",

      choices: [
        { title: "GLOBAL_VARIABLE", value: "global-varibale" },
        { title: "TASK_VARIABLE", value: "task-variable" },
        { title: "CPU", value: "cpu" },
        { title: "RAM", value: "ram" },
        { title: "STORAGE", value: "storage" },
        { title: "NETWORK", value: "network" },
        { title: "ARCHITECTURE", value: "architecture" },
        { title: "OS", value: "os" },
      ],
    })
  ).mode;
  console.log(mode);
}
t()