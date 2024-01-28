import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { execSync } from "child_process";
import axios from "axios";
import grayMatter from "gray-matter";
import { GraphQLClient, gql } from "graphql-request";

const run = async () => {
  const gh_token = getInput("gh-token");
  const hashnode_personal_access_token = getInput(
    "hashnode-personal-access-token"
  );
  const hashnode_publication_id = getInput("hashnode-publication-id");
  const blog_custom_dir = getInput("blog-custom-dir");

  const octokit = getOctokit(gh_token);

  const graphqlClient = new GraphQLClient("https://gql.hashnode.com/", {
    headers: {
      Authorization: hashnode_personal_access_token || "",
    },
  });

  console.log(context.payload);

  const commitHash = execSync("git rev-parse HEAD").toString().trim();

  try {
    // axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.ENV_GITHUB_TOKEN}`;

    const commitResponse = await axios.get(context.payload.commits[0].url);

    // console.log(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${commitHash}`)
    // console.log(commitResponse)
    if (commitResponse.status === 200) {
      console.log("gping in");
      const data = commitResponse.data;

      //   console.log(data);
      // Filter and fetch the content of Markdown files
      const markdownFiles = data.files.filter(
        (file: { filename: string }) =>
          file.filename.endsWith(".md") || file.filename.endsWith(".mdx")
      );
      //   console.log(markdownFiles);
      for (const file of markdownFiles) {
        const filePath = file.filename;

        const fileContentResponse = await axios.get(
          `https://raw.githubusercontent.com/skarthikeyan96/ga-hashnode-publish/${commitHash}/${filePath}`
        );

        if (fileContentResponse.status === 200) {
          const fileContent = fileContentResponse.data;
          //   await fs.writeFile(filePath, fileContent, 'utf-8');
          parseMdxFileContent(fileContent);
          // console.log(`Content of ${filePath}:\n${fileContent}`);
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

const parseMdxFileContent = (fileContent: any) => {
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
  console.log(variables);

  // const results = await graphqlClient.request(mutation, variables);
  // console.log(results)
};

run();
