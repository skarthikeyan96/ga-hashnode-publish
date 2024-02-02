import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { execSync } from "child_process";
import axios from "axios";
import grayMatter from "gray-matter";
import { GraphQLClient, gql } from "graphql-request";

const hashnode_personal_access_token = getInput(
  "hashnode-personal-access-token"
);
const graphqlClient = new GraphQLClient("https://gql.hashnode.com/", {
  headers: {
    Authorization: hashnode_personal_access_token || "",
  },
});

const run = async () => {
//   const gh_token = getInput("gh-token");

  const hashnode_publication_id = getInput("hashnode-publication-id");
  const blog_custom_dir = getInput("blog-custom-dir");

  const commitHash = execSync("git rev-parse HEAD").toString().trim();

  try {
    // const commitUrl = context.payload.commits[0].url;
    // const username = commitUrl.split("/")[2];
    // const reponame = commitUrl.split("/")[3];
    // 

    console.log("payload", context.payload.pull_request)

    
    const commitResponse = await axios.get(
      `https://api.github.com/repos/skarthikeyan96/ga-hashnode-publish/commits/${commitHash}`
    );
    const customBlogPath = `${blog_custom_dir}/` || "";

    if (commitResponse.status === 200) {
      const data = commitResponse.data;

      const markdownFiles = data.files.filter(
        (file: { filename: string }) =>
          file.filename.endsWith(".md") || file.filename.endsWith(".mdx")
      );
      for (const file of markdownFiles) {
        const filePath = file.filename;

        console.log("filePath", filePath);
        const fileContentResponse = await axios.get(
          `https://raw.githubusercontent.com/skarthikeyan96/ga-hashnode-publish/${commitHash}/${customBlogPath}${filePath}`
        );

        if (fileContentResponse.status === 200) {
          const fileContent = fileContentResponse.data;
          parseMdxFileContent(fileContent);
        } else {
          console.error(
            `Failed to fetch content of ${filePath}:`,
            fileContentResponse.statusText
          );
        }
      }
    } else {
      console.error(
        "Failed to fetch commit details:",
        commitResponse.statusText
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

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

  const results = await graphqlClient.request(mutation, variables);
  console.log(results);
};

run();
