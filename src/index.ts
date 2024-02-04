import { getInput, setFailed } from "@actions/core";
import { execSync } from "child_process";
import { context, getOctokit } from "@actions/github";

const hashnode_personal_access_token = getInput(
  "hashnode-personal-access-token"
);
const hashnode_publication_id = getInput("hashnode-publication-id");
const blog_custom_dir = getInput("blog-custom-dir");

const run = () => {
  console.log("hello world")
  if(!hashnode_personal_access_token){
    setFailed("Please add your hashnode personal access token")
    return;
  }
  if(!hashnode_publication_id){
    setFailed("Please add your hashnode publication id")
    return;
  }
  // getting the latest commit
  const commitHash = execSync("git rev-parse HEAD").toString().trim();

  try {
    console.log("payload", context.payload.payload.commits_url)
  } catch (error) {
    console.log("error", error)
  }
}

run()