import { NextResponse } from "next/server";
import { docClient } from "@/lib/db";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "QuizLabTests";

    // Scan for all metadata records
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: {
        ":sk": "METADATA",
      },
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    // Group tests by course
    const coursesMap: Record<string, any> = {};

    for (const item of items) {
      // PK is TEST#course-slug#test-slug
      const pkParts = item.PK.split("#");
      if (pkParts.length !== 3) continue;

      const courseId = pkParts[1];
      const testId = pkParts[2];

      if (!coursesMap[courseId]) {
        coursesMap[courseId] = {
          id: courseId,
          name: item.courseName || "Unknown Course",
          tests: [],
        };
      }

      // Add the test to the course
      coursesMap[courseId].tests.push({
        id: testId,
        name: item.testName || "Unknown Test",
        totalQuestions: item.totalQuestions || 0,
        // The frontend will now call /api/quiz/course-slug/test-slug
        path: `/api/quiz/${courseId}/${testId}`,
      });
    }

    // Sort courses by ID
    const courses = Object.values(coursesMap).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    // Sort tests within each course by ID
    for (const course of courses) {
      course.tests.sort((a: any, b: any) => a.id.localeCompare(b.id));
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch manifest:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
