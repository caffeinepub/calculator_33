import Array "mo:core/Array";
import VarArray "mo:core/VarArray";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";



actor {
  type HistoryEntry = {
    expression : Text;
    result : Text;
    timestamp : Time.Time;
  };

  var calculationHistory : [HistoryEntry] = [];

  public shared ({ caller }) func add(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x + y;
    let expression = x.toText() # " + " # y.toText();
    addToHistory(expression, result.toText());
    { expression; result };
  };

  public shared ({ caller }) func subtract(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x - y;
    let expression = x.toText() # " - " # y.toText();
    addToHistory(expression, result.toText());
    { expression; result };
  };

  public shared ({ caller }) func multiply(x : Int, y : Int) : async {
    result : Int;
    expression : Text;
  } {
    let result = x * y;
    let expression = x.toText() # " * " # y.toText();
    addToHistory(expression, result.toText());
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
    addToHistory(expression, result.toText());
    { expression; result };
  };

  func filterHistoryByTime() : [HistoryEntry] {
    let currentTime = Time.now();
    let sevenDaysNanos = 7 * 24 * 60 * 60 * 1_000_000_000;

    calculationHistory.filter(
      func(entry) {
        currentTime - entry.timestamp <= sevenDaysNanos
      }
    );
  };

  func addToHistory(expression : Text, result : Text) {
    let newEntry : HistoryEntry = {
      expression;
      result;
      timestamp = Time.now();
    };
    calculationHistory := (VarArray.fromArray<HistoryEntry>([newEntry]).concat(VarArray.fromArray<HistoryEntry>(historyWithLimit(9)))).toArray();
  };

  func historyWithLimit(limit : Nat) : [HistoryEntry] {
    var filteredSize = calculationHistory.size();
    if (filteredSize > limit) {
      filteredSize := limit;
    };
    calculationHistory.values().take(filteredSize).toArray();
  };

  public query ({ caller }) func getHistory() : async [(Text, Text)] {
    filterHistoryByTime().map(
      func(entry) { (entry.expression, entry.result) }
    );
  };

  public shared ({ caller }) func clearHistory() : async () {
    calculationHistory := [];
  };
};
