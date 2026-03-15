import { NextResponse } from "next/server";
import { docClient } from "@/lib/db";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; testId: string }> }
) {
  try {
    const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "QuizLabTests";
    const { courseId, testId } = await params;
    const pk = `TEST#${courseId}#${testId}`;

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": pk,
      },
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Reconstruct the quiz object
    const metadataItem = items.find((item) => item.SK === "METADATA");
    const questionItems = items.filter((item) => item.SK.startsWith("Q#"));

    // Sort questions by their sequence (SK) just in case
    questionItems.sort((a, b) => a.SK.localeCompare(b.SK));

    const quizResponse = {
      id: testId,
      course: metadataItem?.courseName || "Unknown Course",
      title: metadataItem?.testName || "Unknown Test",
      totalQuestions: metadataItem?.totalQuestions || questionItems.length,
      questions: questionItems.map((q) => ({
        id: q.number,
        domain: q.domain || "",
        prompt: q.prompt,
        isMultiSelect: q.isMultiSelect,
        options: q.options,
        explanation: q.explanation || "",
        references: q.references || [],
      })),
    };

    return NextResponse.json(quizResponse);
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz details" },
      { status: 500 }
    );
  }
}
