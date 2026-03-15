import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "",
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN || "",
  }),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
