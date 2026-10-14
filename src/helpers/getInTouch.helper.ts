import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

const AreaOfInterest = ["Household Products", "Daily Consumer Goods", "Import Services", "Export Services", "General Enquiry"];

export interface CustomerData {
  "FULL NAME": string;
  Company : string;
  "Email Address": string;
  "Area of Interest": string;
  MASSAGE: string;
}

interface IFillForm {
  data: CustomerData;
  page: Page;
}

function generateSafeName(): string {
  const name = faker.person.fullName();
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
}

function generateSafeCompanyName(): string {
  const companyName = faker.company.name();
  return companyName
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateSafeEmail(): string {
  const email = faker.internet.email();
  return email.replace(/[^a-zA-Z0-9@._-]/g, "").trim();
}

function generateSafeMessage(): string {
  const message = faker.lorem.paragraph();
  return message.replace(/[^a-zA-Z0-9\s.,!?]/g, "").trim();
}

export function buildCustomerData(): CustomerData {
  return {
    "FULL NAME": generateSafeName(),
    Company: generateSafeCompanyName(),
    "Email Address": generateSafeEmail(),
    "Area of Interest": faker.helpers.arrayElement(AreaOfInterest),
    MASSAGE: generateSafeMessage(),
  };
}

export const fillForm = async ({ data, page }: IFillForm) => ({
  async fillFullName() {
    await page.getByPlaceholder("Full Name").fill(data["FULL NAME"]);
  },
  async fillCompany() {
    await page.getByPlaceholder("Company").fill(data.Company);
  },
  async fillEmail() {
    await page.getByPlaceholder("Email Address").fill(data["Email Address"]);
  },
  async selectAreaOfInterest() {
    await page.getByRole("combobox", { name: "Area of Interest" }).selectOption(data["Area of Interest"]);
  },
  async fillMessage() {
    await page.getByPlaceholder("Message").fill(data.MASSAGE);
  },
  async submitForm() {
    await page.getByRole("button", { name: "Submit" }).click();
  },
  async fillAll() {
    await this.fillFullName();
    await this.fillCompany();
    await this.fillEmail();
    await this.selectAreaOfInterest();
    await this.fillMessage();
  },
  async verifySubmission() {
    await expect(page.getByText("Thank you for getting in touch!")).toBeVisible();
  },
});