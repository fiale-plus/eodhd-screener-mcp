export interface TestResult {
  test?: string;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export class Assertions {
  static assertToolExists(tools: any[], toolName: string): TestResult {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      return {
        success: false,
        message: `Tool "${toolName}" not found in tools list`,
      };
    }
    return {
      success: true,
      message: `Tool "${toolName}" exists`,
      data: tool,
    };
  }

  static assertResponseStructure(response: any, expectedKeys: string[]): TestResult {
    if (!response || typeof response !== "object") {
      return {
        success: false,
        message: "Response is not an object",
      };
    }

    const missingKeys = expectedKeys.filter(key => !(key in response));
    if (missingKeys.length > 0) {
      return {
        success: false,
        message: `Missing required keys: ${missingKeys.join(", ")}`,
      };
    }

    return {
      success: true,
      message: "Response has correct structure",
      data: response,
    };
  }

  static assertContentType(response: any, expectedType: "text" | "json"): TestResult {
    if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
      return {
        success: false,
        message: "Response missing content array",
      };
    }

    const content = response.content[0];
    if (content.type !== expectedType) {
      return {
        success: false,
        message: `Expected content type "${expectedType}", got "${content.type}"`,
      };
    }

    return {
      success: true,
      message: `Content type is "${expectedType}"`,
      data: content,
    };
  }

  static assertValidJSON(text: string): TestResult {
    try {
      const parsed = JSON.parse(text);
      return {
        success: true,
        message: "Valid JSON response",
        data: parsed,
      };
    } catch (error) {
      return {
        success: false,
        message: "Invalid JSON response",
        error,
      };
    }
  }

  static assertArrayLength(data: any[], minLength: number, maxLength?: number): TestResult {
    if (!Array.isArray(data)) {
      return {
        success: false,
        message: "Data is not an array",
      };
    }

    if (data.length < minLength) {
      return {
        success: false,
        message: `Array too short: ${data.length} < ${minLength}`,
      };
    }

    if (maxLength !== undefined && data.length > maxLength) {
      return {
        success: false,
        message: `Array too long: ${data.length} > ${maxLength}`,
      };
    }

    return {
      success: true,
      message: `Array length ${data.length} is within bounds`,
      data,
    };
  }

  static assertDateFormat(dateString: string): TestResult {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return {
        success: false,
        message: `Invalid date format: ${dateString}`,
      };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return {
        success: false,
        message: `Invalid date: ${dateString}`,
      };
    }

    return {
      success: true,
      message: `Valid date format: ${dateString}`,
      data: date,
    };
  }

  static assertNumericRange(value: number, min: number, max: number): TestResult {
    if (typeof value !== "number" || isNaN(value)) {
      return {
        success: false,
        message: `Value is not a number: ${value}`,
      };
    }

    if (value < min || value > max) {
      return {
        success: false,
        message: `Value ${value} outside range [${min}, ${max}]`,
      };
    }

    return {
      success: true,
      message: `Value ${value} is within range [${min}, ${max}]`,
      data: value,
    };
  }
}