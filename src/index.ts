import { getInput, setFailed } from "@actions/core";
import { execSync } from "child_process";
import { context, getOctokit } from "@actions/github";
import axios from "axios";

const hashnode_personal_access_token = getInput(
  "hashnode-personal-access-token"
);
const hashnode_publication_id = getInput("hashnode-publication-id");
const blog_custom_dir = getInput("blog-custom-dir");

const run = async () => {
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
    const username = context?.payload?.pull_request?.user?.login;
    const reponame = context?.payload?.repository?.name
    const commitResponse = await axios.get(
      `https://api.github.com/repos/${username}/${reponame}/commits/${commitHash}`
    );
    const customBlogPath = `${blog_custom_dir}/` || "";
    
    if (commitResponse.status === 200) {
      const data = commitResponse.data;

      const markdownFiles = data.files.filter(
        (file: { filename: string }) =>
          file.filename.endsWith(".md") || file.filename.endsWith(".mdx")
      );

      console.log("markdownFiles", markdownFiles)
      
      if(!markdownFiles.length){
        setFailed("There are no markdown files in this commit");
        return;
      }

      



    }
  } catch (error) {
    setFailed(`${error}`)
  }
}

run()