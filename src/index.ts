import { getInput, setFailed } from "@actions/core";
import { execSync } from "child_process";
import { context, getOctokit } from "@actions/github";
import axios from "axios";
import { GraphQLClient, gql } from "graphql-request";
import grayMatter from "gray-matter";

const hashnode_personal_access_token = getInput(
  "hashnode-personal-access-token"
);
const hashnode_publication_id = getInput("hashnode-publication-id");
const blog_custom_dir = getInput("blog-custom-dir");

const run = async () => {
  console.log("hello world");
  if (!hashnode_personal_access_token) {
    setFailed("Please add your hashnode personal access token");
    return;
  }
  if (!hashnode_publication_id) {
    setFailed("Please add your hashnode publication id");
    return;
  }
  // getting the latest commit
  const commitHash = execSync("git rev-parse HEAD").toString().trim();

  try {
    const username = context?.payload?.pull_request?.user?.login;
    const reponame = context?.payload?.repository?.name;
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

      console.log("markdownFiles", markdownFiles);

      if (!markdownFiles.length) {
        setFailed("There are no markdown files in this commit");
        return;
      }

      for (const file of markdownFiles) {
        const filePath = file.filename;

        // if it falls under any whitelist files do not do anything
        // if(["README.md"].includes(filePath)){
        //   return;
        // }

        if (filePath !== "README.md") {
          // later create whitelist file
          const fileContentResponse = await axios.get(
            `https://raw.githubusercontent.com/skarthikeyan96/ga-hashnode-publish/${commitHash}/${customBlogPath}${filePath}`
          );

          if (fileContentResponse.status === 200) {
            const fileContent = fileContentResponse.data;
            console.log("fileContent", fileContent);
            parseMdxFileContent(fileContent);
          } else {
            console.error(
              `Failed to fetch content of ${filePath}:`,
              fileContentResponse.statusText
            );
          }
        }
      }
    } else {
      console.error(
        "Failed to fetch commit details:",
        commitResponse.statusText
      );
    }
  } catch (error) {
    setFailed(`${error}`);
  }
};

run();

const parseMdxFileContent = async (fileContent: any) => {
  const { data, content } = grayMatter(fileContent);

  const {
    title,
    subtitle,
    tags: [],
  } = data;

  // parse the content and make it ready for sending to hashnode's server

  const mutation = gql`
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          slug
          title
          subtitle
        }
      }
    }
  `;

  const variables = {
    input: {
      title: title, // spread the entire front matter
      publicationId: "5faeafa108f9e538a0136e73", // needs to be constant
      tags: [],
      contentMarkdown: content,
    },
  };

  console.log(title);

  // const results = await graphqlClient.request(mutation, variables);
  // console.log(results);
};
