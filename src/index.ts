
import { getInput, setFailed } from "@actions/core";
import { execSync } from "child_process";
import { context } from "@actions/github";
import axios, { AxiosResponse } from "axios";
import { GraphQLClient, gql } from "graphql-request";
import grayMatter from "gray-matter";

interface File {
  filename: string;
}

interface CommitResponseData {
  files: File[];
}

const hashnode_personal_access_token: string = getInput(
  "hashnode-personal-access-token"
);
const hashnode_publication_id: string = getInput("hashnode-publication-id");
const blog_custom_dir: string = getInput("blog-custom-dir");

const getCommitHash = (): string => execSync("git rev-parse HEAD").toString().trim();

const getCommitDetails = async (username: string, reponame: string, commitHash: string): Promise<AxiosResponse<CommitResponseData>> => {
  try {
    return await axios.get<CommitResponseData>(
      `https://api.github.com/repos/${username}/${reponame}/commits/${commitHash}`
    );
  } catch (error) {
    throw new Error(`Failed to fetch commit details: ${error}`);
  }
};

const getFileContent = async (username: string, reponame: string, commitHash: string, filePath: string): Promise<AxiosResponse<string>> => {
  try {
    return await axios.get<string>(
      `https://raw.githubusercontent.com/skarthikeyan96/ga-hashnode-publish/${commitHash}/${blog_custom_dir}/${filePath}`
    );
  } catch (error) {
    throw new Error(`Failed to fetch content of ${filePath}: ${error}`);
  }
};

const processMarkdownFiles = async (files: File[] | undefined): Promise<void> => {
  if (!files || files.length === 0) {
    setFailed("There are no markdown files in this commit");
    return;
  }

  for (const file of files) {
    const filePath: string = file.filename;

    if (filePath !== "README.md") {
      try {
        const fileContentResponse = await getFileContent(
          context.payload.pull_request?.user?.login || "",
          context.payload.repository?.name || "",
          getCommitHash(),
          filePath
        );

        if (fileContentResponse.status === 200) {
          const fileContent: string = fileContentResponse.data;
          console.log("fileContent", fileContent);
          parseMdxFileContent(fileContent);
        }
      } catch (error: any) {
        console.error(error.message);
      }
    }
  }
};

const run = async (): Promise<void> => {
  console.log("hello world");
  if (!hashnode_personal_access_token) {
    setFailed("Please add your hashnode personal access token");
    return;
  }
  if (!hashnode_publication_id) {
    setFailed("Please add your hashnode publication id");
    return;
  }

  const commitHash: string = getCommitHash();

  try {
    // const { user, repository } = context.payload.pull_request || { user: { login: "" }, repository: { name: "" } };
    const commitResponse: AxiosResponse<CommitResponseData> = await getCommitDetails(
      context.payload.pull_request?.user?.login || "",
      context.payload.repository?.name || "",
      commitHash
    );

    if (commitResponse.status === 200) {
      const data: CommitResponseData = commitResponse.data;
      await processMarkdownFiles(data.files);
    } else {
      console.error("Failed to fetch commit details:", commitResponse.statusText);
    }
  } catch (error) {
    setFailed(`${error}`);
  }
};

const parseMdxFileContent = async (fileContent: string): Promise<void> => {
  const { data, content } = grayMatter(fileContent);
  const { title, subtitle, tags = [] } = data;

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
      title, // spread the entire front matter
      publicationId: "5faeafa108f9e538a0136e73", // needs to be constant
      tags,
      contentMarkdown: content,
    },
  };

  console.log(title);

  // const results = await graphqlClient.request(mutation, variables);
  // console.log(results);
};

run();
