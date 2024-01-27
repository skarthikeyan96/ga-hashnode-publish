import { getInput, setFailed } from "@actions/core";
import {context, getOctokit} from '@actions/github'

const run = async () => {
    const gh_token = getInput('gh-token')
    const hashnode_personal_access_token = getInput('hashnode-personal-access-token')
    const hashnode_publication_id = getInput('hashnode-publication-id')
    const blog_custom_dir = getInput('blog-custom-dir')

    const octokit = getOctokit(gh_token)
    console.log(octokit)

}

run()