import Array "mo:core/Array";
import VarArray "mo:core/VarArray";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

actor {
  var calculationHistory : [(Text, Text)] = [];

  public shared ({ caller }) func add(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x + y;
    let expression = x.toText() # " + " # y.toText();
    addToHistory((expression, result.toText()));
    { expression; result };
  };

  public shared ({ caller }) func subtract(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x - y;
    let expression = x.toText() # " - " # y.toText();
    addToHistory((expression, result.toText()));
    { expression; result };
  };

  public shared ({ caller }) func multiply(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x * y;
    let expression = x.toText() # " * " # y.toText();
    addToHistory((expression, result.toText()));
    { expression; result };
  };

  public shared ({ caller }) func divide(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    if (y == 0) {
      Runtime.trap("Division by zero");
    };
    let result = x / y;
    let expression = x.toText() # " / " # y.toText();
    addToHistory((expression, result.toText()));
    { expression; result };
  };

  func addToHistory(entry : (Text, Text)) {
    let newEntry = [entry];
    calculationHistory := (newEntry.values().concat(calculationHistory.values().take(9))).toArray();
  };

  public query ({ caller }) func getHistory() : async [(Text, Text)] {
    calculationHistory;
  };
};
