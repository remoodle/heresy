import { config } from "../../../config";

export const createAlert = async (data: any) => {
  const { url, secret, enabled } = config.alert;

  if (!enabled) {
    return;
  }

  try {
    const response = await fetch(`${url}/new`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error(error);
  }
};
