import { screen } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes";
import Router from "../app/Router";
import Bills from "../containers/Bills.js";
import firebase from "../__mocks__/firebase";
import Firestore from "../app/Firestore";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const pathname = ROUTES_PATH["Bills"];
      Object.defineProperty(window, "location", { value: { hash: pathname } });
      document.body.innerHTML = `<div id="root"></div>`;
      Router();
      expect(
        screen.getByTestId("icon-window").classList.contains("active-icon")
      ).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe("Given I am connected as Employee and I am on Bills page", () => {
  describe("And I click on the eye icon", () => {
    test("A modal should open", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const sampleBills = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      sampleBills.handleClickIconEye = jest.fn();
      screen.getAllByTestId("icon-eye")[0].click();
      expect(sampleBills.handleClickIconEye).toBeCalled();
    });
    test("Then the modal should display the attached image", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const sampleBills = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`);
      $.fn.modal = jest.fn();
      sampleBills.handleClickIconEye(iconEye);
      expect($.fn.modal).toBeCalled();
      expect(document.querySelector(".modal")).toBeTruthy();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills UI", () => {
    test("fetches bills from  API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
